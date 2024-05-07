// SPDX-License-Identifier: MIT
pragma solidity ^0.8.7;

contract FundingHub {
    address public hubOwner;
    uint public projectFee;
    uint public projectCount;
    uint public hubBalance;
    StatsStruct public hubStats;
    ProjectStruct[] public projects;

    mapping(address => ProjectStruct[]) public projectsOf;
    mapping(uint => BackerStruct[]) public backersOf;
    mapping(uint => bool) public projectExist;

    enum StatusEnum {
        OPEN,
        APPROVED,
        REVERTED,
        DELETED,
        PAIDOUT
    }

    struct StatsStruct {
        uint totalProjects;
        uint totalBacking;
        uint totalDonations;
    }

    struct BackerStruct {
        address contributor;
        uint contribution;
        uint timestamp;
        bool refunded;
    }

    struct ProjectStruct {
        uint id;
        address owner;
        string title;
        string description;
        string imageURL;
        uint cost;
        uint raised;
        uint timestamp;
        uint expiresAt;
        uint backers;
        StatusEnum status;
    }

    modifier ownerOnly() {
        require(msg.sender == hubOwner, "Owner reserved only");
        _;
    }

    event Action (
        uint256 id,
        string actionType,
        address indexed executor,
        uint256 timestamp
    );

    constructor(uint _projectFee) {
        hubOwner = msg.sender;
        projectFee = _projectFee;
    }

    function startProject(
        string memory title,
        string memory description,
        string memory imageURL,
        uint cost,
        uint expiresAt
    ) public returns (bool) {
        require(bytes(title).length > 0, "Title cannot be empty");
        require(bytes(description).length > 0, "Description cannot be empty");
        require(bytes(imageURL).length > 0, "ImageURL cannot be empty");
        require(cost > 0 ether, "Cost cannot be zero");

        ProjectStruct memory newProject;
        newProject.id = projectCount;
        newProject.owner = msg.sender;
        newProject.title = title;
        newProject.description = description;
        newProject.imageURL = imageURL;
        newProject.cost = cost;
        newProject.timestamp = block.timestamp;
        newProject.expiresAt = expiresAt;

        projects.push(newProject);
        projectExist[projectCount] = true;
        projectsOf[msg.sender].push(newProject);
        hubStats.totalProjects += 1;

        emit Action (
            projectCount++,
            "PROJECT STARTED",
            msg.sender,
            block.timestamp
        );
        return true;
    }

    function modifyProject(
        uint id,
        string memory title,
        string memory description,
        string memory imageURL,
        uint expiresAt
    ) public returns (bool) {
        require(msg.sender == projects[id].owner, "Unauthorized Entity");
        require(bytes(title).length > 0, "Title cannot be empty");
        require(bytes(description).length > 0, "Description cannot be empty");
        require(bytes(imageURL).length > 0, "ImageURL cannot be empty");

        projects[id].title = title;
        projects[id].description = description;
        projects[id].imageURL = imageURL;
        projects[id].expiresAt = expiresAt;

        emit Action (
            id,
            "PROJECT MODIFIED",
            msg.sender,
            block.timestamp
        );

        return true;
    }

    function cancelProject(uint id) public returns (bool) {
        require(projects[id].status == StatusEnum.OPEN, "Project no longer opened");
        require(msg.sender == projects[id].owner, "Unauthorized Entity");

        projects[id].status = StatusEnum.DELETED;
        refundContributors(id);

        emit Action (
            id,
            "PROJECT CANCELED",
            msg.sender,
            block.timestamp
        );

        return true;
    }

    function refundContributors(uint id) internal {
        for(uint i = 0; i < backersOf[id].length; i++) {
            address contributor = backersOf[id][i].contributor;
            uint contribution = backersOf[id][i].contribution;
            
            backersOf[id][i].refunded = true;
            backersOf[id][i].timestamp = block.timestamp;
            payTo(contributor, contribution);

            hubStats.totalBacking -= 1;
            hubStats.totalDonations -= contribution;
        }
    }

    function contributeToProject(uint id) public payable returns (bool) {
        require(msg.value > 0 ether, "Ether must be greater than zero");
        require(projectExist[id], "Project not found");
        require(projects[id].status == StatusEnum.OPEN, "Project no longer opened");

        hubStats.totalBacking += 1;
        hubStats.totalDonations += msg.value;
        projects[id].raised += msg.value;
        projects[id].backers += 1;

        backersOf[id].push(
            BackerStruct(
                msg.sender,
                msg.value,
                block.timestamp,
                false
            )
        );

        emit Action (
            id,
            "PROJECT BACKED",
            msg.sender,
            block.timestamp
        );

        if(projects[id].raised >= projects[id].cost) {
            projects[id].status = StatusEnum.APPROVED;
            hubBalance += projects[id].raised;
            completePayout(id);
            return true;
        }

        if(block.timestamp >= projects[id].expiresAt) {
            projects[id].status = StatusEnum.REVERTED;
            refundContributors(id);
            return true;
        }

        return true;
    }

    function completePayout(uint id) internal {
        uint raised = projects[id].raised;
        uint fee = (raised * projectFee) / 100;

        projects[id].status = StatusEnum.PAIDOUT;

        payTo(projects[id].owner, (raised - fee));
        payTo(hubOwner, fee);

        hubBalance -= projects[id].raised;

        emit Action (
            id,
            "PROJECT PAID OUT",
            msg.sender,
            block.timestamp
        );
    }

    function requestProjectRefund(uint id) public returns (bool) {
        require(
            projects[id].status != StatusEnum.REVERTED ||
            projects[id].status != StatusEnum.DELETED,
            "Project not marked as revert or delete"
        );
        
        projects[id].status = StatusEnum.REVERTED;
        refundContributors(id);
        return true;
    }

    function payoutProject(uint id) public returns (bool) {
        require(projects[id].status == StatusEnum.APPROVED, "Project not approved");
        require(
            msg.sender == projects[id].owner ||
            msg.sender == hubOwner,
            "Unauthorized Entity"
        );

        completePayout(id);
        return true;
    }

    function adjustFee(uint _projectFee) public ownerOnly {
        projectFee = _projectFee;
    }

    function getProjectDetails(uint id) public view returns (ProjectStruct memory) {
        require(projectExist[id], "Project not found");

        return projects[id];
    }
    
    function getAllProjects() public view returns (ProjectStruct[] memory) {
        return projects;
    }
    
    function getProjectBackers(uint id) public view returns (BackerStruct[] memory) {
        return backersOf[id];
    }

    function payTo(address to, uint256 amount) internal {
        (bool success, ) = payable(to).call{value: amount}("");
        require(success);
    }
}
